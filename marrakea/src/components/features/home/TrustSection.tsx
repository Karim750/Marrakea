import Image from 'next/image';
import styles from './TrustSection.module.css';

const proofs = [
  {
    id: '1',
    title: 'Artisans identifiés',
    text: 'Brahim El Haddad, potier à Safi',
    image: 'https://images.pexels.com/photos/3084334/pexels-photo-3084334.jpeg',
  },
  {
    id: '2',
    title: 'Matières vérifiées',
    text: 'Argile, laine, cuir, bois... Traçabilité annoncée',
    image: 'https://images.pexels.com/photos/17409449/pexels-photo-17409449.jpeg',
  },
  {
    id: '3',
    title: 'Techniques documentées',
    text: 'Processus, temps, contraintes expliqués',
    image: 'https://images.pexels.com/photos/34211793/pexels-photo-34211793.jpeg',
  },
];

export function TrustSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Protocole</p>
        <h2 className={styles.title}>Artisanat fondé sur la confiance</h2>

        <div className={styles.grid}>
          {proofs.map((proof) => (
            <div key={proof.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <Image
                  src={proof.image}
                  alt={proof.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className={styles.image}
                />
              </div>
              <h3 className={styles.cardTitle}>{proof.title}</h3>
              <p className={styles.cardText}>{proof.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
