using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Net;

namespace ProjectManagement.Middleware
{
    public class GlobalExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionHandlerMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // Log the exception
            Log.Error(exception, "An unhandled exception occurred");

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = new
            {
                success = false,
                message = "An error occurred while processing your request.",
                error = exception.Message,
                // Only include stack trace in development
                stackTrace = context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment() 
                    ? exception.StackTrace 
                    : null
            };

            await context.Response.WriteAsJsonAsync(response);
        }
    }

    // Extension method to register the middleware
    public static class GlobalExceptionHandlerMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        {
            return app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
        }
    }
}
