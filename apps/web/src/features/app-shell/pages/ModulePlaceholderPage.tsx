type ModulePlaceholderPageProps = {
  title: string;
  description: string;
};

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <section aria-labelledby="module-placeholder-title">
      <header>
        <p>MÓDULO</p>

        <h1 id="module-placeholder-title">{title}</h1>
      </header>

      <div>
        <p>{description}</p>

        <p>Este módulo será desenvolvido em um próximo ciclo.</p>
      </div>
    </section>
  );
}
