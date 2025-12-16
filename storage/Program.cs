using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks; 

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

string logDir = "/data";
string logFile = Path.Combine(logDir, "log.txt");

Directory.CreateDirectory(logDir);

app.MapPost("/log", async (HttpRequest request) =>
{
    Console.WriteLine("Storage: Received log entry");

    try
    {
        using var reader = new StreamReader(request.Body);
        var logLine = await reader.ReadToEndAsync();

        await File.AppendAllTextAsync(logFile, logLine + Environment.NewLine);

        return Results.Text("OK", "text/plain");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error writing to log file: {ex.Message}");
        return Results.Text("Error writing to log file", "text/plain", statusCode: 500);
    }
});

app.MapGet("/log", async () =>
{
    Console.WriteLine("Storage: Received log retrieval request");

    try
    {
        if (File.Exists(logFile))
        {
            var content = await File.ReadAllTextAsync(logFile);

            if (string.IsNullOrEmpty(content))
            {
                return Results.Text("No logs yet", "text/plain");
            }

            return Results.Text(content, "text/plain");
        }
        else
        {
            return Results.Text("File not found. Create a log entry first.", "text/plain");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error reading log file: {ex.Message}");
        return Results.Text("Error reading log file", "text/plain", statusCode: 500);
    }
});

app.MapDelete("/log", async () =>
{
    Console.WriteLine("Storage: Received log deletion request");

    try
    {
        if (File.Exists(logFile))
        {
            File.Delete(logFile);
            return Results.Text("Log file cleared", "text/plain");
        }
        else
        {
            return Results.Text("File not found. Nothing to delete.", "text/plain");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error deleting log file: {ex.Message}");
        return Results.Text("Error deleting log file", "text/plain", statusCode: 500);
    }
});

Console.WriteLine("Storage service listening");

app.Run();
