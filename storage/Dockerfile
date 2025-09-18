FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /usr/src/storage

RUN dotnet new web -n Storage

WORKDIR /usr/src/storage/Storage

RUN rm Program.cs

COPY Program.cs .

RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8082

EXPOSE 8082

CMD ["dotnet", "Storage.dll"]
