# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Directory.Build.props", "./"]
COPY ["Directory.Packages.props", "./"]
COPY ["src/Web/ProjectManagement.csproj", "src/Web/"]
RUN dotnet restore "src/Web/ProjectManagement.csproj"

COPY . .
WORKDIR "/src/src/Web"
RUN dotnet publish "ProjectManagement.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage nhẹ hơn
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Nếu muốn healthcheck, cài wget nhẹ hơn curl
RUN apk add --no-cache wget

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ProjectManagement.dll"]