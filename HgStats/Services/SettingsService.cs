using System.IO;
using Newtonsoft.Json;

namespace HgStats.Services
{
    public class SettingsService
    {
        private const string settingsFileName = "settings.json";

        public Settings Settings { get; }

        public SettingsService()
        {
            Settings = JsonConvert.DeserializeObject<Settings>(File.ReadAllText(settingsFileName));
        }
    }

    public class Settings
    {
        public string HgRoot { get; set; }
    }
}