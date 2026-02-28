import * as vscode from "vscode";
import { ApiClient } from "./api";

interface Exercise {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  orderIndex: number;
  tags: string[];
}

export class ExerciseTreeItem extends vscode.TreeItem {
  constructor(
    public readonly exercise: Exercise,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(exercise.title, collapsibleState);
    this.tooltip = `${exercise.title} (${exercise.difficulty})`;
    this.description = `#${exercise.orderIndex}`;

    const iconMap: Record<string, string> = {
      easy: "circle-filled",
      medium: "circle-outline",
      hard: "warning",
    };
    this.iconPath = new vscode.ThemeIcon(iconMap[exercise.difficulty] || "circle-outline");

    this.command = {
      command: "codeexo.openExercise",
      title: "Ouvrir l'exercice",
      arguments: [exercise],
    };
  }
}

export class DifficultyGroupItem extends vscode.TreeItem {
  constructor(
    public readonly difficulty: string,
    public readonly exercises: Exercise[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    const labels: Record<string, string> = {
      easy: "Facile",
      medium: "Moyen",
      hard: "Difficile",
    };
    super(labels[difficulty] || difficulty, collapsibleState);
    this.description = `(${exercises.length})`;
    this.iconPath = new vscode.ThemeIcon(
      difficulty === "easy" ? "pass" : difficulty === "medium" ? "info" : "error"
    );
  }
}

export class ExerciseProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private exercises: Exercise[] = [];

  constructor(private api: ApiClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async loadExercises(): Promise<void> {
    try {
      const result = await this.api.listExercises({ pageSize: 100 });
      this.exercises = result.data;
      this.refresh();
    } catch {
      this.exercises = [];
      this.refresh();
    }
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) {
      // Root: group by difficulty
      const groups: Record<string, Exercise[]> = { easy: [], medium: [], hard: [] };
      for (const ex of this.exercises) {
        if (groups[ex.difficulty]) {
          groups[ex.difficulty].push(ex);
        }
      }
      return Object.entries(groups)
        .filter(([, exs]) => exs.length > 0)
        .map(
          ([diff, exs]) =>
            new DifficultyGroupItem(diff, exs, vscode.TreeItemCollapsibleState.Expanded)
        );
    }

    if (element instanceof DifficultyGroupItem) {
      return element.exercises
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((ex) => new ExerciseTreeItem(ex, vscode.TreeItemCollapsibleState.None));
    }

    return [];
  }
}
