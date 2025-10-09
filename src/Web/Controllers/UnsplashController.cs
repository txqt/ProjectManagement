using Microsoft.AspNetCore.Mvc;

namespace ProjectManagement.Controllers
{
    public class UnsplashController : Controller
    {
        // GET
        public IActionResult Index()
        {
            return View();
        }
    }
}