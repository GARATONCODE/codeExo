import axios, { AxiosInstance } from "axios";

const DEFAULT_API_URL = "https://backend-production-387d.up.railway.app/api/v1";

export class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || DEFAULT_API_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  setToken(token: string | null) {
    this.accessToken = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post("/auth/login", { email, password });
    return data.data;
  }

  async me() {
    const { data } = await this.client.get("/auth/me", { headers: this.getHeaders() });
    return data.data;
  }

  async listExercises(params?: Record<string, any>) {
    const { data } = await this.client.get("/exercises", { params, headers: this.getHeaders() });
    return data.data;
  }

  async getExercise(id: number) {
    const { data } = await this.client.get(`/exercises/${id}`, { headers: this.getHeaders() });
    return data.data;
  }

  async getTemplate(id: number, lang: string) {
    const { data } = await this.client.get(`/exercises/${id}/template/${lang}`, { headers: this.getHeaders() });
    return data.data;
  }

  async submit(exerciseId: number, language: string, code: string) {
    const { data } = await this.client.post(
      "/submissions",
      { exerciseId, language, code },
      { headers: this.getHeaders() }
    );
    return data.data;
  }

  async getDailyExercise() {
    const { data } = await this.client.get("/daily/today", { headers: this.getHeaders() });
    return data.data;
  }
}
