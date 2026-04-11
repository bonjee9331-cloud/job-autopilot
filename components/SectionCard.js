export default function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="card">
      {(title || subtitle || actions) ? (
        <div className="section-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p className="small">{subtitle}</p> : null}
          </div>
          {actions ? <div className="row">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
