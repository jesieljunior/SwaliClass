using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BitraHub.Application.Common.Interfaces;
using BitraHub.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BitraHub.Infrastructure.Auth;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var sub = Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                   ?? Principal?.FindFirst("sub")?.Value;
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? UserEmail => Principal?.FindFirst(ClaimTypes.Email)?.Value;

    public string? UserRole => Principal?.FindFirst(ClaimTypes.Role)?.Value;

    public Guid? TenantId
    {
        get
        {
            var tenantClaim = Principal?.FindFirst("tenant_id")?.Value;
            return Guid.TryParse(tenantClaim, out var id) ? id : null;
        }
    }

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;
}

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user, string tenantName, string tenantPlan)
    {
        var secret = _configuration["Jwt:Secret"] ?? "BitraHubSuperSecretKeyForDevelopmentAndTestingOnly_Minimum32Bytes!";
        var issuer = _configuration["Jwt:Issuer"] ?? "BitraHub.WebApi";
        var audience = _configuration["Jwt:Audience"] ?? "BitraHub.Clients";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new("tenant_id", user.TenantId?.ToString() ?? string.Empty),
            new("tenant_name", tenantName),
            new("tenant_plan", tenantPlan)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
