<script>
	import '../styles/styles.css';
	import {goto} from '$app/navigation';
	export let name = 'Hallen Name';
	export let id = 'Hallen ID';
	export let desc = 'Hier würde eine kurze beschreibung der Halle stehen. Evtl auch nur Öffnungszeiten und Adresse';
	export let adresse = 'Hier würde die Adresse stehen';
	export let image_url = "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.antenneniederrhein.de%2Fexternalimages%2F%3Fsource%3Djpg248%2Fboulderhalle-kleve.jpg%26crop%3D0x125x6000x3750%26resize%3D1280x800%26dt%3D202007130845510&f=1&nofb=1";

</script>


<div class="card mb-3 halle"  style="max-width: 540px; cursor: pointer;">
	<a sveltekit:prefetch href={`/gyms/${id}`}>
	<div class="row g-0">
		<div class="col-md-4 image-container">
			<img
				class="img-fluid rounded-start hallen-image"
				src={image_url}
				alt="..."
			/>
		</div>
		<div class="col-md-8">
			<div class="card-body">
				<h5 class="card-title">{name}</h5>
				<p class="card-text">
					{desc.split(/\s+/).slice(0, 30).join(' ') + '...'}
				</p>
				<p class="card-text"><small class="text-muted">{adresse}</small></p>
			</div>
		</div>
	</div>
</a>
</div>

<style>
	a, a:hover, a:focus, a:active {
     text-decoration: none;
     color: inherit;
 }
</style>
