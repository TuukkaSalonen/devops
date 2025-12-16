FROM mcr.microsoft.com/dotnet/aspnet:7.0

WORKDIR /app

COPY publish/ .

ENV ASPNETCORE_URLS=http://+:8082

EXPOSE 8082

CMD ["dotnet", "Storage.dll"]
