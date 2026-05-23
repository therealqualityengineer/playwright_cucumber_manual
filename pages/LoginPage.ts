import { Page } from '@playwright/test';
import envData from '../test-data/env-Data';
import users from '../test-data/users.json';

export class LoginPage {
  private readonly usernameInput;
  private readonly passwordInput;
  private readonly loginButton;

  constructor(private page: Page) {
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }

  async navigate() {
    await this.page.goto('https://ctmsqa.contingenttalentmanagement.com/wfportal/login.cfm');
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async waitForLoginSuccess() {
    await this.page.waitForURL((url) => !url.pathname.includes('login.cfm'));
  }

  async navigateEnv(environment: string) {
    const url = envData[environment as keyof typeof envData];
    if (!url) throw new Error(`Unknown environment: ${environment}`);
    await this.page.goto(url);
  }

  getCredentials(credential: string) {
    let username = '';
    let password = '';
    if(credential === 'default') {
      username = users.default.username;
      password = users.default.password;
    }else { 
      username = credential;
      password = users.default.password;
    }
    return { username, password };
  }

  async login(application: string, credential: string) {
    await this.navigateEnv(application);
    const { username, password } = this.getCredentials(credential);
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
    await this.waitForLoginSuccess();
  }
}
