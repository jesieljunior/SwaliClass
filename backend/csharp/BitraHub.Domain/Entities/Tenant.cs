using BitraHub.Domain.Common;

namespace BitraHub.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public TenantPlan Plan { get; set; } = TenantPlan.Professional;
    public string Status { get; set; } = "active";
    public string ContactEmail { get; set; } = string.Empty;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Course> Courses { get; set; } = new List<Course>();
    public ICollection<ClassGroup> Classes { get; set; } = new List<ClassGroup>();
    public ICollection<Student> Students { get; set; } = new List<Student>();
}
