import { html, render } from "lit-html";
import { ii_backend } from "declarations/ii_backend";
import logo from "./logo2.svg";
import { AuthClient } from "@dfinity/auth-client";
import { Actor } from "@dfinity/agent";

const days = BigInt(1);
const hours = BigInt(24);
const nanoseconds = BigInt(3600000000000);

// Add default options
const defaultOptions = {
  createOptions: {
    idleOptions: {
      disableIdle: true,
    },
  },
  loginOptions: {
    identityProvider:
      process.env.DFX_NETWORK === "ic"
        ? "https://identity.ic0.app/#authorize"
        : `http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai#authorize`,
    maxTimeToLive: days * hours * nanoseconds,
  },
};

class App {
  greeting = "";
  #authClient = null;
  isAuthenticated = false;

  constructor() {
    this.#render();
    this.#createAuthClient();
  }

  /**
   * Replace backend actor identity with the identity from AuthClient,
   * additionally re-render to show the updated authentication status
   */
  #onIdentityUpdate = async () => {
    Actor.agentOf(ii_backend).replaceIdentity(this.#authClient.getIdentity());
    this.isAuthenticated = await this.#authClient.isAuthenticated();
    this.#render();
  };

  /**
   * Create AuthClient, this loads an existing session if available
   */
  #createAuthClient = async () => {
    this.#authClient = await AuthClient.create(defaultOptions.createOptions);
    this.authClient = await AuthClient.create();

    await this.#onIdentityUpdate();
  };

  #handleSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    this.greeting = await ii_backend.greet(name);
    this.#render();
  };

  /**
   * Login with AuthClient, this should be called without any delay in a click handler
   */
  #handleLogin = async () => {
    // await new Promise((resolve, reject) =>
    //   this.#authClient.login({
    //     ...defaultOptions.loginOptions,
    //     onSuccess: resolve,
    //     onError: reject,
    //   })
    // );
    await new Promise((resolve, reject) =>
      this.authClient.login({
        identityProvider: this.#identityProvider(),
        onSuccess: resolve,
        onError: reject,
      })
    );
    await this.#onIdentityUpdate();
  };

  /**
   * Logout with AuthClient
   */
  #handleLogout = async () => {
    await this.#authClient.logout();
    await this.#onIdentityUpdate();
  };

  #identityProvider = () => {
    if (process.env.DFX_NETWORK === "local") {
      return `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`;
    } else if (process.env.DFX_NETWORK === "ic") {
      return `https://${process.env.CANISTER_ID_INTERNET_IDENTITY}.ic0.app`;
    } else {
      return `https://${process.env.CANISTER_ID_INTERNET_IDENTITY}.dfinity.network`;
    }
  };

  #render() {
    let body = html`
      <main>
        <img src="${logo}" alt="DFINITY logo" />
        <br />
        <br />
        <form action="#">
          <label for="name">Enter your name: &nbsp;</label>
          <input id="name" alt="Name" type="text" />
          <button type="submit">Click Me!</button>
        </form>
        <center>
          ${this.isAuthenticated ? html`<button id="logout">Logout</button>` : html`<button id="login">Login</button>`}
          <button id="whoami">Who am I?</button>
        </center>
        <section id="greeting">${this.greeting}</section>
      </main>
    `;
    render(body, document.getElementById("root"));
    document.querySelector("form").addEventListener("submit", this.#handleSubmit);
    document.querySelector("#whoami").addEventListener("click", this.#handleWhoAmI);
    document.querySelector("#login")?.addEventListener("click", this.#handleLogin);
    document.querySelector("#logout")?.addEventListener("click", this.#handleLogout);
  }
  /**
   * Call the new backend function and render the returned principal to the screen
   */
  #handleWhoAmI = async () => {
    const principal = await ii_backend.whoami();
    this.greeting = `Your principal is: ${principal.toText()}`;
    this.#render();
  };
}

export default App;
