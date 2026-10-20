using BitraHub.Application.Common.Interfaces;
using BitraHub.Application.DTOs;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly BitraHubDbContext _context;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(
        BitraHubDbContext context,
        IJwtTokenGenerator jwtGenerator,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _jwtGenerator = jwtGenerator;
        _currentUserService = currentUserService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Credenciais inválidas ou usuário inativo." });
        }

        var tenantName = user.Tenant?.Name ?? "Sistema Central";
        var tenantPlan = user.Tenant?.Plan.ToString().ToLower() ?? "enterprise";
        var token = _jwtGenerator.GenerateToken(user, tenantName, tenantPlan);

        var userDto = new UserDto(user.Id, user.Email, user.FullName, user.Role, user.TenantId, user.AvatarUrl);
        var tenantDto = new TenantSummaryDto(user.TenantId ?? Guid.Empty, tenantName, tenantPlan);

        return Ok(new AuthResponse(token, userDto, tenantDto));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        if (!_currentUserService.UserId.HasValue)
            return Unauthorized();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == _currentUserService.UserId.Value);

        if (user == null)
            return NotFound();

        return Ok(new UserDto(user.Id, user.Email, user.FullName, user.Role, user.TenantId, user.AvatarUrl));
    }

    [HttpPost("accept-invite")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> AcceptInvite([FromBody] AcceptInviteRequest request)
    {
        var invite = await _context.Invites
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Token == request.Token && i.Status == "pending");

        if (invite == null || invite.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Convite inválido ou expirado." });
        }

        var tenant = await _context.Tenants.FindAsync(invite.TenantId);
        if (tenant == null)
            return BadRequest(new { message = "Instituição não encontrada." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = invite.Email,
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = invite.Role,
            TenantId = invite.TenantId,
            IsActive = true
        };

        invite.Status = "accepted";
        invite.AcceptedAt = DateTime.UtcNow;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtGenerator.GenerateToken(user, tenant.Name, tenant.Plan.ToString().ToLower());
        return Ok(new AuthResponse(
            token,
            new UserDto(user.Id, user.Email, user.FullName, user.Role, user.TenantId, user.AvatarUrl),
            new TenantSummaryDto(tenant.Id, tenant.Name, tenant.Plan.ToString().ToLower())
        ));
    }
}
