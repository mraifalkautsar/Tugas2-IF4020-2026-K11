package controller

import "net/http"

func Health(w http.ResponseWriter, r *http.Request) {
	JSONResponse(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}
