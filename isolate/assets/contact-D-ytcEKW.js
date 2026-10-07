function m(a,n){const i=a.replace(/[^0-9]/g,"");if(i.length<7)return null;const e=`https://wa.me/${i.replace(/^0/,"62")}`;return n?.trim()?`${e}?text=${encodeURIComponent(n)}`:e}const d=[{key:"undangan",label:"Undangan acara",build:a=>`Halo ${a.namaTamu}! 👋

Dengan bahagia kami, ${a.pasangan}, mengundang Anda ke acara pernikahan kami.

📅 ${a.tanggal}`+(a.venue?`
📍 ${a.venue}`:"")+`

Mohon konfirmasi kehadiran Anda ya. Sampai bertemu! 🤍`},{key:"rsvp",label:"Konfirmasi kehadiran (RSVP)",build:a=>`Halo ${a.namaTamu}! Mohon konfirmasi kehadiran Anda untuk pernikahan ${a.pasangan} pada ${a.tanggal}.

Balas: “Hadir” / “Tidak hadir” / jumlah orang yang ikut. Terima kasih! 🤍`},{key:"pengingat",label:"Pengingat H-7",build:a=>`Halo ${a.namaTamu}! Pengingat bahwa pernikahan ${a.pasangan} tinggal 7 hari lagi, pada ${a.tanggal}`+(a.venue?` di ${a.venue}`:"")+`.

Kami menantikan kehadiran Anda. Sampai jumpa! 🤍`},{key:"terimakasih",label:"Terima kasih pasca acara",build:a=>`Halo ${a.namaTamu}! Terima kasih banyak sudah hadir dan memberi doa restu untuk ${a.pasangan}. Kehadiran Anda berarti sangat banyak bagi kami. 🤍`}];export{d as W,m as w};
