import styles from './MethodSection.module.css';

const items = [
  {
    id: '1',
    title: 'Matière',
    description:
      'Composition, origine et propriétés décrites sur chaque fiche. Traçabilité annoncée quand connue.',
  },
  {
    id: '2',
    title: 'Atelier',
    description:
      "Nom de l'artisan, localisation de l'atelier, spécialité. Identité vérifiable et documentée.",
  },
  {
    id: '3',
    title: 'Geste',
    description:
      'Technique employée, temps estimé de fabrication, étapes clés du processus expliquées.',
  },
  {
    id: '4',
    title: 'Limites',
    description:
      'Variations naturelles, contraintes matérielles, ce qui ne peut être garanti. Transparence assumée.',
  },
];

export function MethodSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Protocole</p>
        <h2 className={styles.title}>Notre méthode de référence</h2>
        <p className={styles.intro}>
          Chaque objet référencé suit un protocole de documentation qui précise ce qui peut
          l&apos;être. Pas de storytelling, des faits vérifiables.
        </p>

        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
