window.addEventListener("load", () => {
  if (typeof SwaggerUIBundle !== "function") {
    const error = document.getElementById("loading-error");
    error.textContent = "Swagger UI could not load. Reload this page or download the OpenAPI specification above.";
    error.hidden = false;
    return;
  }

  window.ui = SwaggerUIBundle({
    url: "./openapi.json",
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    deepLinking: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: 0,
    docExpansion: "list",
    supportedSubmitMethods: ["get", "post"],
    validatorUrl: null,
    queryConfigEnabled: false,
    persistAuthorization: false,
  });
});
