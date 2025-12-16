import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import org.json.JSONArray;
import org.json.JSONObject;

public class Server {
    public static void main(String[] args) throws IOException {
        // Basic server running on port 8119
        HttpServer server = HttpServer.create(new InetSocketAddress(8119), 0);

        server.createContext("/", new MyHandler());

        server.start();
        System.out.println("Server listening on http://localhost:8119");
    }

    static class MyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try (exchange) {
                String requestMethod = exchange.getRequestMethod();
                // Only handle POST requests
                if (requestMethod.equalsIgnoreCase("POST")) {
                    handlePostRequest(exchange);
                }
            }
        }

        // Handle POST request to calculate average
        private void handlePostRequest(HttpExchange exchange) throws IOException {
            InputStream inputStream = exchange.getRequestBody();

            String requestBody;
            try (Scanner scanner = new Scanner(inputStream, StandardCharsets.UTF_8.name())) {
                scanner.useDelimiter("\\A");
                requestBody = scanner.hasNext() ? scanner.next() : "";
            }

            int average = 0;
            try {
                // Parse JSON input
                JSONObject jsonObject = new JSONObject(requestBody);
                JSONArray numbersArray = jsonObject.getJSONArray("numbers");
                double sum = 0;
                
                // Calculate sum for average from the array
                for (int i = 0; i < numbersArray.length(); i++) {
                    sum += numbersArray.getDouble(i);
                }
                average = (int) Math.floor(sum / numbersArray.length());

            } catch (Exception e) {
                // Handle JSON parsing errors
                exchange.sendResponseHeaders(400, 0);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write("Invalid JSON input".getBytes());
                }
            }
            // Send response as plain text with the average
            exchange.getResponseHeaders().add("Content-Type", "text/plain");
            exchange.sendResponseHeaders(200, String.valueOf(average).getBytes().length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(String.valueOf(average).getBytes());
            }
        }
    }
}
