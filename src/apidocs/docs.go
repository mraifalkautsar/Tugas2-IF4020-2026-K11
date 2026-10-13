// Package apidocs serves the OpenAPI document and a self-contained Swagger UI.
package apidocs

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed static/*
var assets embed.FS

// Register adds the documentation routes to the backend's existing mux.
func Register(mux *http.ServeMux) {
	static, err := fs.Sub(assets, "static")
	if err != nil {
		panic(err)
	}
	files := http.FileServer(http.FS(static))
	mux.Handle("GET /docs/", http.StripPrefix("/docs/", files))
	mux.HandleFunc("GET /openapi.json", func(w http.ResponseWriter, r *http.Request) {
		// Serve the same embedded specification at a stable, top-level URL.
		r = r.Clone(r.Context())
		r.URL.Path = "/openapi.json"
		files.ServeHTTP(w, r)
	})
}
