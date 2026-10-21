using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BitraHub.Application.Common.Interfaces;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Auth;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;
using Xunit;

namespace SwaliClass.Tests;

public class AuthSecurityTests
{
    private const string TestJwtSecret = "SwaliClassTestSecurityKeyForUnitTestingOnly_Minimum32BytesRequired!";
    private const string TestIssuer = "SwaliClass.WebApi";
    private const string TestAudience = "SwaliClass.Clients";

    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthSecurityTests()
    {
        var mockConfig = new Mock<IConfiguration>();
        mockConfig.Setup(c => c["Jwt:Secret"]).Returns(TestJwtSecret);
        mockConfig.Setup(c => c["Jwt:Issuer"]).Returns(TestIssuer);
        mockConfig.Setup(c => c["Jwt:Audience"]).Returns(TestAudience);

        _tokenGenerator = new JwtTokenGenerator(mockConfig.Object);
    }

    [Fact]
    public void BCrypt_Password_Hashing_Should_Produce_Valid_Hash_And_Verify()
    {
        // Arrange
        const string rawPassword = "SecurePassword@2026!";

        // Act
        var hash = BCrypt.Net.BCrypt.HashPassword(rawPassword);
        var isValid = BCrypt.Net.BCrypt.Verify(rawPassword, hash);
        var isInvalid = BCrypt.Net.BCrypt.Verify("WrongPassword123", hash);

        // Assert
        hash.Should().StartWith("$2");
        isValid.Should().BeTrue();
        isInvalid.Should().BeFalse();
    }

    [Fact]
    public void GenerateToken_Should_Include_Required_Tenant_And_User_Claims()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "prof.silva@swaliclass.io",
            FullName = "Prof. Silva",
            Role = Roles.Teacher,
            TenantId = tenantId
        };

        // Act
        var tokenString = _tokenGenerator.GenerateToken(user, "Unidade Central SP", "professional");

        // Assert
        tokenString.Should().NotBeNullOrWhiteSpace();

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(tokenString);

        jwt.Issuer.Should().Be(TestIssuer);
        jwt.Audiences.Should().Contain(TestAudience);
        jwt.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value.Should().Be(userId.ToString());
        jwt.Claims.First(c => c.Type == ClaimTypes.Email).Value.Should().Be("prof.silva@swaliclass.io");
        jwt.Claims.First(c => c.Type == ClaimTypes.Role).Value.Should().Be(Roles.Teacher);
        jwt.Claims.First(c => c.Type == "tenant_id").Value.Should().Be(tenantId.ToString());
        jwt.Claims.First(c => c.Type == "tenant_name").Value.Should().Be("Unidade Central SP");
        jwt.Claims.First(c => c.Type == "tenant_plan").Value.Should().Be("professional");
    }

    [Fact]
    public void GeneratedToken_Should_Pass_Standard_TokenValidationParameters()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@swaliclass.io",
            FullName = "Admin Gestor",
            Role = Roles.Admin,
            TenantId = Guid.NewGuid()
        };
        var tokenString = _tokenGenerator.GenerateToken(user, "Escola Beta", "enterprise");

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = TestIssuer,
            ValidateAudience = true,
            ValidAudience = TestAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Act
        var principal = tokenHandler.ValidateToken(tokenString, validationParameters, out var validatedToken);

        // Assert
        principal.Should().NotBeNull();
        principal.Identity!.IsAuthenticated.Should().BeTrue();
        validatedToken.Should().BeAssignableTo<JwtSecurityToken>();
    }
}
