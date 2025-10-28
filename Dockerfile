# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj và restore dependencies
COPY ["Directory.Build.props", "./"]
COPY ["Directory.Packages.props", "./"]
COPY ["src/Web/ProjectManagement.csproj", "src/Web/"]
RUN dotnet restore "src/Web/ProjectManagement.csproj"

# Copy toàn bộ source code và build
COPY . .
WORKDIR "/src/src/Web"
RUN dotnet build "ProjectManagement.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "ProjectManagement.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProjectManagement.dll"]