using System;
using System.Diagnostics;

namespace HgStats.Helpers
{
    public static class CmdHelper
    {
        public static string[] Run(string command)
        {
            var cmd = new Process
            {
                StartInfo =
                {
                    FileName = "cmd.exe",
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                }
            };
            cmd.Start();

            cmd.StandardInput.WriteLine(command);
            cmd.StandardInput.Flush();
            cmd.StandardInput.Close();
            cmd.WaitForExit();
            var output = cmd.StandardOutput.ReadToEnd();

            var commandInd = output.IndexOf(command);
            var outputAfterCommand = output.Substring(commandInd + command.Length);
            return outputAfterCommand.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        }
    }
}