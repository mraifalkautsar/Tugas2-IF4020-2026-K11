package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/controller"
)

func main() {
	port := flag.Int("port", 8000, "Port to listen on")
	flag.Parse()

	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil {
			*port = p
		}
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", controller.Health)
	mux.HandleFunc("GET /api/health", controller.Health)

	mux.HandleFunc("POST /api/cipher/process", controller.Process)
	mux.HandleFunc("POST /api/cipher/trace", controller.Trace)
	mux.HandleFunc("POST /api/cipher/avalanche", controller.Avalanche)

	handler := controller.SecurityMiddleware(mux)

	addr := fmt.Sprintf(":%d", *port)
	server := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	idleConnsClosed := make(chan struct{})
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt, syscall.SIGTERM)
		<-sigint

		log.Println("[INFO] Shutting down backend server gracefully...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("[ERROR] Server shutdown error: %v\n", err)
		}
		close(idleConnsClosed)
	}()

	log.Printf("[INFO] Brainrot Cipher backend server starting on %s\n", addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("[FATAL] Server ListenAndServe error: %v\n", err)
	}

	<-idleConnsClosed
	log.Println("[INFO] Backend server stopped.")
}
