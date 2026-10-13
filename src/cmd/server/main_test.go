package main

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func performRequest(handler http.Handler, method, path, contentType string, body io.Reader) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, body)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

func specification(t *testing.T, handler http.Handler) map[string]any {
	t.Helper()
	rec := performRequest(handler, http.MethodGet, "/openapi.json", "", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("specification returned %d: %s", rec.Code, rec.Body)
	}
	var spec map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &spec); err != nil {
		t.Fatal(err)
	}
	return spec
}

func TestDocumentationRoutes(t *testing.T) {
	handler := newHandler()
	for path, contentType := range map[string]string{
		"/docs/":                       "text/html",
		"/docs/swagger-ui.css":         "text/css",
		"/docs/swagger-ui-bundle.js":   "text/javascript",
		"/docs/swagger-initializer.js": "text/javascript",
		"/docs/openapi.json":           "application/json",
		"/openapi.json":                "application/json",
	} {
		t.Run(path, func(t *testing.T) {
			rec := performRequest(handler, http.MethodGet, path, "", nil)
			if rec.Code != http.StatusOK || !strings.HasPrefix(rec.Header().Get("Content-Type"), contentType) {
				t.Fatalf("status=%d type=%q", rec.Code, rec.Header().Get("Content-Type"))
			}
			if rec.Body.Len() == 0 || rec.Header().Get("X-Content-Type-Options") != "nosniff" {
				t.Fatal("missing documentation body or security middleware")
			}
		})
	}
	redirect := performRequest(handler, http.MethodGet, "/docs", "", nil)
	// Go versions differ in which redirect status ServeMux uses here.
	if (redirect.Code != http.StatusMovedPermanently && redirect.Code != http.StatusTemporaryRedirect) || redirect.Header().Get("Location") != "/docs/" {
		t.Fatalf("/docs must redirect to /docs/: status=%d location=%q", redirect.Code, redirect.Header().Get("Location"))
	}
	a := performRequest(handler, http.MethodGet, "/openapi.json", "", nil)
	b := performRequest(handler, http.MethodGet, "/docs/openapi.json", "", nil)
	if !bytes.Equal(a.Body.Bytes(), b.Body.Bytes()) {
		t.Fatal("documentation URLs serve different specifications")
	}
}

func TestPublishedJSONExamples(t *testing.T) {
	handler := newHandler()
	spec := specification(t, handler)
	paths := spec["paths"].(map[string]any)
	for path, item := range paths {
		if _, ok := item.(map[string]any)["get"]; ok {
			rec := performRequest(handler, http.MethodGet, path, "", nil)
			if rec.Code != http.StatusOK {
				t.Fatalf("documented health path %s returned %d", path, rec.Code)
			}
			continue
		}
		operation := item.(map[string]any)["post"].(map[string]any)
		body := operation["requestBody"].(map[string]any)
		media := body["content"].(map[string]any)["application/json"].(map[string]any)
		for name, entry := range media["examples"].(map[string]any) {
			t.Run(path+"/"+name, func(t *testing.T) {
				value := entry.(map[string]any)["value"]
				payload, err := json.Marshal(value)
				if err != nil {
					t.Fatal(err)
				}
				rec := performRequest(handler, http.MethodPost, path, "application/json", bytes.NewReader(payload))
				if rec.Code != http.StatusOK {
					t.Fatalf("published example failed: %d %s", rec.Code, rec.Body)
				}
				var result map[string]any
				if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
					t.Fatal(err)
				}
				responses := operation["responses"].(map[string]any)
				content := responses["200"].(map[string]any)["content"].(map[string]any)
				schemaRef := content["application/json"].(map[string]any)["schema"].(map[string]any)["$ref"].(string)
				schemas := spec["components"].(map[string]any)["schemas"].(map[string]any)
				schema := schemas[strings.TrimPrefix(schemaRef, "#/components/schemas/")].(map[string]any)
				for _, field := range schema["required"].([]any) {
					if _, ok := result[field.(string)]; !ok {
						t.Fatalf("response omits documented field %s", field)
					}
				}
				if name == "cbcEncrypt" || name == "cbcDecrypt" {
					responseName := "cbcEncrypted"
					if name == "cbcDecrypt" {
						responseName = "cbcDecrypted"
					}
					examples := content["application/json"].(map[string]any)["examples"].(map[string]any)
					want := examples[responseName].(map[string]any)["value"].(map[string]any)
					for _, field := range []string{"status", "output_hex", "output_base64", "entropy"} {
						if result[field] != want[field] {
							t.Fatalf("documented %s=%v, actual=%v", field, want[field], result[field])
						}
					}
				}
			})
		}
	}
}

func TestDocumentedFileUpload(t *testing.T) {
	handler := newHandler()
	spec := specification(t, handler)
	schemas := spec["components"].(map[string]any)["schemas"].(map[string]any)
	properties := schemas["FileProcessRequest"].(map[string]any)["properties"].(map[string]any)
	plain := []byte{0, 255, 128, 10, 0, 1, 0}
	process := func(action string, input []byte) []byte {
		t.Helper()
		var body bytes.Buffer
		form := multipart.NewWriter(&body)
		fields := map[string]string{"action": action, "mode": "CBC", "padding": "PKCS7"}
		for _, field := range []string{"key", "iv"} {
			fields[field] = properties[field].(map[string]any)["example"].(string)
		}
		for field, value := range fields {
			if err := form.WriteField(field, value); err != nil {
				t.Fatal(err)
			}
		}
		file, err := form.CreateFormFile("file", "example.bin")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := file.Write(input); err != nil {
			t.Fatal(err)
		}
		if err := form.Close(); err != nil {
			t.Fatal(err)
		}
		rec := performRequest(handler, http.MethodPost, "/api/cipher/process", form.FormDataContentType(), &body)
		if rec.Code != http.StatusOK {
			t.Fatalf("file %s failed: %d %s", action, rec.Code, rec.Body)
		}
		var response struct {
			Hex    string `json:"output_hex"`
			Base64 string `json:"output_base64"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		decoded, err := base64.StdEncoding.DecodeString(response.Base64)
		if err != nil || hex.EncodeToString(decoded) != response.Hex {
			t.Fatal("hex/base64 outputs do not represent the same file bytes")
		}
		return decoded
	}
	encrypted := process("encrypt", plain)
	if !bytes.Equal(process("decrypt", encrypted), plain) {
		t.Fatal("the documented upload/decode/re-upload workflow lost binary data")
	}
}
