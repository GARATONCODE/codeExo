import * as vscode from "vscode";
import { ApiClient } from "./api";
import { ExerciseProvider } from "./exerciseProvider";

let api: ApiClient;
let exerciseProvider: ExerciseProvider;
let statusBarItem: vscode.StatusBarItem;
let currentExerciseId: number | null = null;
let currentLanguage = "python";

export function activate(context: vscode.ExtensionContext) {
  api = new ApiClient();
  exerciseProvider = new ExerciseProvider(api);

  // Register tree data provider
  vscode.window.registerTreeDataProvider("codeexo.exercises", exerciseProvider);

  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(code) CodeExo";
  statusBarItem.command = "codeexo.dailyExercise";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Restore token from SecretStorage
  context.secrets.get("codeexo.accessToken").then((token) => {
    if (token) {
      api.setToken(token);
      statusBarItem.text = "$(code) CodeExo (connecté)";
      exerciseProvider.loadExercises();
    }
  });

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("codeexo.login", async () => {
      const email = await vscode.window.showInputBox({
        prompt: "Email",
        placeHolder: "vous@exemple.com",
      });
      if (!email) return;

      const password = await vscode.window.showInputBox({
        prompt: "Mot de passe",
        password: true,
      });
      if (!password) return;

      try {
        const result = await api.login(email, password);
        api.setToken(result.accessToken);
        await context.secrets.store("codeexo.accessToken", result.accessToken);
        await context.secrets.store("codeexo.refreshToken", result.refreshToken);

        statusBarItem.text = `$(code) CodeExo (${result.user.username})`;
        vscode.window.showInformationMessage(`Connecté en tant que ${result.user.username}`);
        exerciseProvider.loadExercises();
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Connexion échouée: ${err.response?.data?.error || err.message}`
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeexo.logout", async () => {
      api.setToken(null);
      await context.secrets.delete("codeexo.accessToken");
      await context.secrets.delete("codeexo.refreshToken");
      statusBarItem.text = "$(code) CodeExo";
      vscode.window.showInformationMessage("Déconnecté");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeexo.refreshExercises", () => {
      exerciseProvider.loadExercises();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeexo.openExercise", async (exercise: any) => {
      currentExerciseId = exercise.id;

      try {
        const full = await api.getExercise(exercise.id);

        // Show description in webview
        const panel = vscode.window.createWebviewPanel(
          "codeexo.readme",
          `${full.title} - README`,
          vscode.ViewColumn.Two,
          {}
        );

        panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; color: #e2e8f0; background: #0f172a; }
    h1 { color: #6366f1; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-bottom: 16px; }
    .easy { background: rgba(34,197,94,0.2); color: #22c55e; }
    .medium { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .hard { background: rgba(239,68,68,0.2); color: #ef4444; }
    pre { background: #1e293b; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: 'Fira Code', monospace; }
  </style>
</head>
<body>
  <h1>${full.title}</h1>
  <span class="badge ${full.difficulty}">${full.difficulty}</span>
  <div>${full.description.replace(/\n/g, "<br>")}</div>
</body>
</html>`;

        // Open template in editor
        const templateMap: Record<string, string> = {
          c: full.templateC,
          python: full.templatePython,
          typescript: full.templateTypescript,
        };

        const extMap: Record<string, string> = {
          c: "c",
          python: "py",
          typescript: "ts",
        };

        const template = templateMap[currentLanguage] || full.templatePython;
        const ext = extMap[currentLanguage] || "py";

        const doc = await vscode.workspace.openTextDocument({
          content: template,
          language: currentLanguage === "c" ? "c" : currentLanguage === "python" ? "python" : "typescript",
        });

        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Erreur: ${err.response?.data?.error || err.message}`
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeexo.selectLanguage", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          { label: "Python", value: "python" },
          { label: "C", value: "c" },
          { label: "TypeScript", value: "typescript" },
        ],
        { placeHolder: "Sélectionner un langage" }
      );

      if (choice) {
        currentLanguage = choice.value;
        vscode.window.showInformationMessage(`Langage: ${choice.label}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeexo.submitCode", async () => {
      if (!currentExerciseId) {
        vscode.window.showWarningMessage("Ouvrez d'abord un exercice");
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Aucun éditeur actif");
        return;
      }

      const code = editor.document.getText();

      try {
        statusBarItem.text = "$(sync~spin) Exécution...";
        const result = await api.submit(currentExerciseId, currentLanguage, code);

        if (result.passed) {
          vscode.window.showInformationMessage("Tous les tests passent !");
          statusBarItem.text = "$(check) CodeExo - Réussi";
        } else {
          vscode.window.showWarningMessage("Certains tests ont échoué");
          statusBarItem.text = "$(x) CodeExo - Échoué";
        }

        // Show output
        const outputChannel = vscode.window.createOutputChannel("CodeExo");
        outputChannel.clear();
        outputChannel.appendLine(`=== Résultat (${currentLanguage}) ===`);
        outputChannel.appendLine(`Status: ${result.status}`);
        outputChannel.appendLine(`Passed: ${result.passed}`);
        outputChannel.appendLine("");
        outputChannel.appendLine(result.output || "Pas de sortie");
        outputChannel.show();

        // Reset status bar after delay
        setTimeout(() => {
          statusBarItem.text = "$(code) CodeExo";
        }, 5000);
      } catch (err: any) {
        statusBarItem.text = "$(code) CodeExo";
        vscode.window.showErrorMessage(
          `Erreur: ${err.response?.data?.error || err.message}`
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeexo.dailyExercise", async () => {
      try {
        const daily = await api.getDailyExercise();
        if (daily?.exercise) {
          vscode.commands.executeCommand("codeexo.openExercise", daily.exercise);
        } else {
          vscode.window.showInformationMessage("Aucun exercice disponible");
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Erreur: ${err.response?.data?.error || err.message}`
        );
      }
    })
  );
}

export function deactivate() {}
