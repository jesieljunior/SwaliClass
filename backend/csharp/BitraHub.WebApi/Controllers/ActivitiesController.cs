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
[Route("api/v1/activities")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly BitraHubDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ActivitiesController(BitraHubDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ActivityDto>>> List(
        [FromQuery] Guid? classId = null,
        [FromQuery] string? status = null)
    {
        var query = _context.Activities
            .Include(a => a.ClassGroup)
            .Include(a => a.Submissions)
            .AsQueryable();

        if (classId.HasValue && classId.Value != Guid.Empty)
        {
            query = query.Where(a => a.ClassGroupId == classId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<ActivityStatus>(status, true, out var parsedStatus))
                query = query.Where(a => a.Status == parsedStatus);
        }

        var activities = await query
            .OrderByDescending(a => a.DueDate)
            .Select(a => new ActivityDto(
                a.Id,
                a.ClassGroupId,
                a.ClassGroup != null ? a.ClassGroup.Name : null,
                a.Title,
                a.Description,
                a.DueDate,
                a.MaxScore,
                a.Weight,
                a.Status.ToString().ToLower(),
                a.Submissions.Count,
                a.Submissions.Count(s => s.Score.HasValue),
                a.CreatedAt
            ))
            .ToListAsync();

        return Ok(activities);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator},{Roles.Teacher}")]
    public async Task<ActionResult<ActivityDto>> Upsert([FromBody] UpsertActivityRequest request)
    {
        var parsedStatus = Enum.TryParse<ActivityStatus>(request.Status, true, out var st) ? st : ActivityStatus.Published;

        Activity activity;
        if (request.Id.HasValue && request.Id.Value != Guid.Empty)
        {
            var existing = await _context.Activities.FindAsync(request.Id.Value);
            if (existing == null)
                return NotFound(new { message = "Atividade não encontrada." });

            existing.ClassGroupId = request.ClassGroupId;
            existing.Title = request.Title;
            existing.Description = request.Description;
            existing.DueDate = request.DueDate;
            existing.MaxScore = request.MaxScore;
            existing.Weight = request.Weight;
            existing.Status = parsedStatus;
            activity = existing;
        }
        else
        {
            activity = new Activity
            {
                ClassGroupId = request.ClassGroupId,
                Title = request.Title,
                Description = request.Description,
                DueDate = request.DueDate,
                MaxScore = request.MaxScore,
                Weight = request.Weight,
                Status = parsedStatus
            };
            _context.Activities.Add(activity);
        }

        await _context.SaveChangesAsync();

        var classGroup = await _context.Classes.FindAsync(activity.ClassGroupId);

        return Ok(new ActivityDto(
            activity.Id,
            activity.ClassGroupId,
            classGroup?.Name,
            activity.Title,
            activity.Description,
            activity.DueDate,
            activity.MaxScore,
            activity.Weight,
            activity.Status.ToString().ToLower(),
            0,
            0,
            activity.CreatedAt
        ));
    }

    [HttpGet("{id}/submissions")]
    public async Task<ActionResult<List<SubmissionDto>>> GetSubmissions(Guid id)
    {
        var submissions = await _context.Submissions
            .Include(s => s.Student)
            .Where(s => s.ActivityId == id)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new SubmissionDto(
                s.Id,
                s.ActivityId,
                s.StudentId,
                s.Student != null ? s.Student.FullName : "Aluno",
                s.SubmittedAt,
                s.FileUrl,
                s.FileName,
                s.Score,
                s.Feedback,
                s.GradedAt
            ))
            .ToListAsync();

        return Ok(submissions);
    }

    [HttpPost("submissions/{submissionId}/grade")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator},{Roles.Teacher}")]
    public async Task<ActionResult<SubmissionDto>> GradeSubmission(
        Guid submissionId,
        [FromBody] GradeSubmissionRequest request)
    {
        var submission = await _context.Submissions
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null)
            return NotFound(new { message = "Entrega não encontrada." });

        submission.Score = request.Score;
        submission.Feedback = request.Feedback;
        submission.GradedAt = DateTime.UtcNow;
        submission.GradedByUserId = _currentUserService.UserId;

        await _context.SaveChangesAsync();

        return Ok(new SubmissionDto(
            submission.Id,
            submission.ActivityId,
            submission.StudentId,
            submission.Student?.FullName ?? "Aluno",
            submission.SubmittedAt,
            submission.FileUrl,
            submission.FileName,
            submission.Score,
            submission.Feedback,
            submission.GradedAt
        ));
    }
}
