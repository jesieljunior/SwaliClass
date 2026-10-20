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
[Route("api/v1/admin")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly BitraHubDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public TenantsController(BitraHubDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet("tenants")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<ActionResult<List<TenantDto>>> ListTenants()
    {
        var tenants = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.Users)
            .Include(t => t.Students)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TenantDto(
                t.Id,
                t.Name,
                t.Slug,
                t.Plan.ToString().ToLower(),
                t.Status,
                t.ContactEmail,
                t.CreatedAt,
                t.Users.Count,
                t.Students.Count
            ))
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpPost("tenants")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<ActionResult<TenantDto>> CreateTenant([FromBody] CreateTenantRequest request)
    {
        var plan = Enum.TryParse<TenantPlan>(request.Plan, true, out var p) ? p : TenantPlan.Professional;
        var slug = request.Name.ToLower()
            .Replace(" ", "-")
            .Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u")
            .Replace("ã", "a").Replace("õ", "o").Replace("ç", "c");

        var tenant = new Tenant
        {
            Name = request.Name,
            Slug = slug,
            Plan = plan,
            Status = "active",
            ContactEmail = request.ContactEmail
        };

        _context.Tenants.Add(tenant);

        // Create initial invite for school admin
        var token = Guid.NewGuid().ToString("N");
        var invite = new Invite
        {
            TenantId = tenant.Id,
            Email = request.AdminEmail,
            Role = Roles.Admin,
            Token = token,
            Status = "pending",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _context.Invites.Add(invite);

        await _context.SaveChangesAsync();

        return Ok(new TenantDto(
            tenant.Id,
            tenant.Name,
            tenant.Slug,
            tenant.Plan.ToString().ToLower(),
            tenant.Status,
            tenant.ContactEmail,
            tenant.CreatedAt,
            1,
            0
        ));
    }

    [HttpGet("invites")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<ActionResult<List<InviteDto>>> ListInvites()
    {
        var invites = await _context.Invites
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var baseUrl = $"{Request.Scheme}://{Request.Host}";

        var result = invites.Select(i =>
        {
            var status = i.Status;
            if (status == "pending" && i.ExpiresAt < DateTime.UtcNow)
            {
                status = "expired";
            }

            return new InviteDto(
                i.Id,
                i.Email,
                i.Role,
                status,
                i.Token,
                $"{baseUrl}/accept-invite?token={i.Token}",
                i.CreatedAt,
                i.ExpiresAt
            );
        }).ToList();

        return Ok(result);
    }

    [HttpPost("invites")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<ActionResult<InviteDto>> CreateInvite([FromBody] CreateInviteRequest request)
    {
        if (!_currentUserService.TenantId.HasValue && !_currentUserService.IsSuperAdmin)
            return Forbid();

        var tenantId = _currentUserService.TenantId ?? Guid.Empty;

        // Check if pending invite already exists
        var existingInvite = await _context.Invites
            .FirstOrDefaultAsync(i => i.Email.ToLower() == request.Email.ToLower() && i.Status == "pending" && i.ExpiresAt > DateTime.UtcNow);

        if (existingInvite != null)
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            return Ok(new InviteDto(
                existingInvite.Id,
                existingInvite.Email,
                existingInvite.Role,
                existingInvite.Status,
                existingInvite.Token,
                $"{baseUrl}/accept-invite?token={existingInvite.Token}",
                existingInvite.CreatedAt,
                existingInvite.ExpiresAt
            ));
        }

        var token = Guid.NewGuid().ToString("N");
        var invite = new Invite
        {
            TenantId = tenantId,
            Email = request.Email.Trim().ToLower(),
            Role = request.Role,
            Token = token,
            Status = "pending",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.Invites.Add(invite);
        await _context.SaveChangesAsync();

        var hostUrl = $"{Request.Scheme}://{Request.Host}";
        return Ok(new InviteDto(
            invite.Id,
            invite.Email,
            invite.Role,
            invite.Status,
            invite.Token,
            $"{hostUrl}/accept-invite?token={invite.Token}",
            invite.CreatedAt,
            invite.ExpiresAt
        ));
    }
}
