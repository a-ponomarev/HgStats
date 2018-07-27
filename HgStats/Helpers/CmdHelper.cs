using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;

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

            var commandInd = output.IndexOf(command, StringComparison.Ordinal);
            var outputAfterCommand = output.Substring(commandInd + command.Length);
            return outputAfterCommand.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        }

        public static string[] Run(params string[] commands)
        {
            return Run(JoinCommands(commands));
        }

        public static string[] RunViaFile(params string[] commands)
        {
            var tmpFile = Path.GetTempFileName();
            Run($"{JoinCommands(commands)} > {tmpFile}");

            var lines = File.ReadAllLines(tmpFile, Encoding.GetEncoding(1251));
            try
            {
                if (File.Exists(tmpFile))
                    File.Delete(tmpFile);
            }
            catch (Exception)
            {
                // ignored
            }

            return lines;
        }

        private static string JoinCommands(IEnumerable<string> commands)
        {
            return string.Join(" && ", commands);
        }
    }
}