/**
 * Bosh sahifa foni: sekin suzuvchi rangli dog'lar.
 *
 * Avval bu three.js (WebGL) edi — ~130 kB kod va har kadrda chizish. Maktab
 * kompyuterlarida aynan shu qotishga sabab bo'lardi. Endi faqat CSS: kod
 * yuklanmaydi, animatsiyani brauzer videokartada arzon bajaradi va
 * «kamroq harakat» sozlamasida u umuman o'chadi.
 */
const SPOTS = [
  { x: "8%", y: "12%", size: 340, color: "#c4996c", delay: "0s" },
  { x: "78%", y: "8%", size: 300, color: "#1f6fd0", delay: "-6s" },
  { x: "62%", y: "62%", size: 380, color: "#d2402f", delay: "-12s" },
  { x: "18%", y: "70%", size: 280, color: "#1f6fd0", delay: "-3s" },
];

export function ThreeBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {SPOTS.map((s, i) => (
        <span
          key={i}
          className="bg-spot absolute rounded-full opacity-[0.13]"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            background: `radial-gradient(circle, ${s.color} 0%, transparent 68%)`,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
