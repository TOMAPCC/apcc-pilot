export default function LoginPage() {
  return (
    <main className="login-page">
      <form className="login-card">
        <div className="brand">
          <img className="brand-logo large" src="/logo-apcc.png" alt="APCC Neuf et Renovation" />
          <div>
            <strong>APCC PILOT</strong>
            <span>Connexion securisee</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" defaultValue="admin@apcc.fr" />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" placeholder="Mot de passe personnel" />
        </div>
        <label style={{ display: "flex", gap: 8, margin: "14px 0", color: "#5d6876" }}>
          <input type="checkbox" /> Se souvenir de moi
        </label>
        <button className="button" type="submit" style={{ width: "100%" }}>Se connecter</button>
        <p className="muted" style={{ textAlign: "center" }}>Mot de passe oublie</p>
      </form>
    </main>
  );
}
