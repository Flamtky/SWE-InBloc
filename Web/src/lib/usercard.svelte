<script>
	import '../styles/styles.css';
	export let user = {
		username: 'Username69',
		email: 'name@domain.com',
		country: 'Germany',
		city: 'Berlin',
		zip: '12345',
		birthdate: '2019-08-24'
	};
</script>

<div class="card mb-3 halle" style="max-width: 540px;">
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
	<div class="row g-0">
		<div class="col-md-4 image-container">
			<img
				class="img-fluid avatar-image"
				src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcours-informatique-gratuit.fr%2Fwp-content%2Fuploads%2F2017%2F10%2Favatar.png&f=1&nofb=1"
				alt="..."
			/>
		</div>
		<div class="col-md-8">
			<div class="card-body">
				<h5 class="card-title">
					{user.username}
				</h5>
				<button id="ubtn" class="btn btn-primary round" type="button">Update</button>
				<button id="ubtn" class="btn btn-danger outline" type="button">Delete</button>
			</div>
		</div>
	</div>
</div>

<style>
	#ubtn {
		margin-top: 5%;
		margin-right: 5%;
	}
</style>
