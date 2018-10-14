using System.Linq;

namespace HgStats.Services
{
    public static class ReviewServiceCollection
    {
        public static readonly ReviewService[] Services = GetServices();

        private static ReviewService[] GetServices()
        {
            var hgRoots = new SettingsService().Settings.HgRoots;
            return hgRoots.Select(r => new ReviewService(r)).ToArray();
        }
    }
}