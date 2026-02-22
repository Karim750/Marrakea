import Image from 'next/image';
import Link from 'next/link';
import styles from './ObjectsSection.module.css';

const objects = [
  {
    id: '1',
    slug: 'grand-tapis-azilal',
    title: 'Grand tapis Azilal',
    image: 'https://images.pexels.com/photos/11275299/pexels-photo-11275299.jpeg',
    gesture: 'Tissage',
    territory: 'Haut Atlas',
    price: '1 450 €',
  },
  {
    id: '2',
    slug: 'plat-creux-safi',
    title: 'Plat creux Safi',
    image: 'https://images.pexels.com/photos/22823/pexels-photo.jpg',
    gesture: 'Tournage',
    territory: 'Safi',
    price: '85 €',
  },
  {
    id: '3',
    slug: 'sac-cuir-tanne',
    title: 'Sac en cuir tanné',
    image: 'https://images.pexels.com/photos/7796162/pexels-photo-7796162.jpeg',
    gesture: 'Tannage',
    territory: 'Fès',
    price: '390 €',
  },
  {
    id: '4',
    slug: 'couverture-handira',
    title: 'Couverture Handira',
    image: 'https://images.pexels.com/photos/13811675/pexels-photo-13811675.jpeg',
    gesture: 'Tissage',
    territory: 'Moyen Atlas',
    price: '580 €',
  },
  {
    id: '5',
    slug: 'bol-ceramique-emaillee',
    title: 'Bol en céramique émaillée',
    image: 'https://images.pexels.com/photos/3084334/pexels-photo-3084334.jpeg',
    gesture: 'Tournage',
    territory: 'Safi',
    price: '45 €',
  },
  {
    id: '6',
    slug: 'coussins-tisses-lot',
    title: 'Coussins tissés (lot de 2)',
    image: 'https://images.pexels.com/photos/17409449/pexels-photo-17409449.jpeg',
    gesture: 'Tissage',
    territory: 'Haut Atlas',
    price: '180 €',
  },
];

export function ObjectsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Objets sélectionnés</h2>

        <div className={styles.grid}>
          {objects.map((object) => (
            <Link key={object.id} href={`/objets/${object.slug}`} className={styles.card}>
              <div className={styles.imageWrapper}>
                <Image
                  src={object.image}
                  alt={object.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                  className={styles.image}
                />
                <div className={styles.overlay}>
                  <h3 className={styles.objectTitle}>{object.title}</h3>
                  <div className={styles.meta}>
                    <p className={styles.metaLine}>
                      Geste : {object.gesture} • {object.territory}
                    </p>
                    <p className={styles.price}>{object.price}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
