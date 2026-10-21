# Multi-stage Dockerfile for SwaliClass .NET 9 WebApi & Automated Test Execution
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for caching restore layer
COPY ["BitraHub.Domain/BitraHub.Domain.csproj", "BitraHub.Domain/"]
COPY ["BitraHub.Application/BitraHub.Application.csproj", "BitraHub.Application/"]
COPY ["BitraHub.Infrastructure/BitraHub.Infrastructure.csproj", "BitraHub.Infrastructure/"]
COPY ["BitraHub.WebApi/BitraHub.WebApi.csproj", "BitraHub.WebApi/"]
COPY ["SwaliClass.Tests/SwaliClass.Tests.csproj", "SwaliClass.Tests/"]
RUN dotnet restore "BitraHub.WebApi/BitraHub.WebApi.csproj"
RUN dotnet restore "SwaliClass.Tests/SwaliClass.Tests.csproj"

# Copy full source
COPY . .

# Run xUnit test suite (fails build if any unit/integration test fails)
WORKDIR "/src/SwaliClass.Tests"
RUN dotnet test "SwaliClass.Tests.csproj" -c Release --no-restore --logger "console;verbosity=normal"

# Publish WebApi
WORKDIR "/src/BitraHub.WebApi"
RUN dotnet publish "BitraHub.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Production runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5000
ENTRYPOINT ["dotnet", "BitraHub.WebApi.dll"]
