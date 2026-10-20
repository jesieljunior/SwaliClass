# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["BitraHub.Domain/BitraHub.Domain.csproj", "BitraHub.Domain/"]
COPY ["BitraHub.Application/BitraHub.Application.csproj", "BitraHub.Application/"]
COPY ["BitraHub.Infrastructure/BitraHub.Infrastructure.csproj", "BitraHub.Infrastructure/"]
COPY ["BitraHub.WebApi/BitraHub.WebApi.csproj", "BitraHub.WebApi/"]
RUN dotnet restore "BitraHub.WebApi/BitraHub.WebApi.csproj"

COPY . .
WORKDIR "/src/BitraHub.WebApi"
RUN dotnet build "BitraHub.WebApi.csproj" -c Release -o /app/build
RUN dotnet publish "BitraHub.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "BitraHub.WebApi.dll"]
