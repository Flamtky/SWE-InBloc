<script>
    import { loggedin_user, local_user_data } from '$lib/stores.js';
	import '../lib/firebase.js';
	import {
		createUserWithEmailAndPassword,
		getAuth,
		onAuthStateChanged,
		signOut
	} from 'firebase/auth';
	import '../styles/Footer-Dark.css';
	import '../styles/Header-Blue.css';
	//import '../styles/styles.css';
	import { browser } from '$app/env';
	import {goto} from '$app/navigation';


	let local_data;
    if(browser && !local_data){
        local_data = JSON.parse($local_user_data);
    }
	getAuth().onAuthStateChanged(function (user) {
		if (user && user.emailVerified) {
			if ($local_user_data != "null") {
				$loggedin_user = user;
				local_data = JSON.parse($local_user_data);
			}else{
				console.log("LOGOUT")
				if(getAuth().currentUser){
					logout();
				}
			}
		} else {
			console.log('not logged in');
			
			$loggedin_user = null;
			if (browser) {
				$local_user_data = null;
			}
		}
		console.log('loggedin_user', $loggedin_user);
		console.log('local_data', local_data);
	});

	function logout() {
		signOut(getAuth())
			.then(function () {
				// Sign-out successful.
				console.log('logout successful');
				console.log($loggedin_user);
				window.location.href = '/';
			})
			.catch(function (error) {
				// An error happened.
			});
	}
</script>

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no" />
	<title>Home</title>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
	/>
	<script
		src="https://code.jquery.com/jquery-3.4.1.min.js"
	/>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,700"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css"
	/>
</head>

<header class="header-blue">
	<nav class="navbar navbar-dark navbar-expand-md navigation-clean-search">
		<div class="container-fluid">
			<a class="navbar-brand" sveltekit:prefetch href="/">In Bloc</a><button
				data-bs-toggle="collapse"
				class="navbar-toggler"
				data-bs-target="#navcol-1"
				><span class="visually-hidden">Toggle navigation</span><span
					class="navbar-toggler-icon"
				/></button
			>
			<div class="collapse navbar-collapse" id="navcol-1">
				<ul class="navbar-nav">
					{#if $loggedin_user === null || $local_user_data === null}
					<li class="nav-item"><a class="nav-link" sveltekit:prefetch href="/">Find Gyms</a></li>
					{:else if browser}
					<li class="nav-item"><a class="nav-link" sveltekit:prefetch href="/admin/users">Users</a></li>
					<li class="nav-item"><a class="nav-link" sveltekit:prefetch href="/">Find Gyms</a></li>
					<li class="nav-item"><a class="nav-link" sveltekit:prefetch href="/admin/users">My Projects</a></li>
					<li class="nav-item"><a class="nav-link" sveltekit:prefetch href="/admin/users">My Gyms</a></li>
					<li class="nav-item"><a class="nav-link" sveltekit:prefetch href="/admin/users">My Stats</a></li>
					<li class="nav-item"><a class="nav-link" sveltekit:prefetch href="/admin/users">Settings</a></li>
					{/if}
				</ul>
				
					<!--This is a spacer for the Login buttons-->
					<div class="me-auto">
						
					</div>

				{#if $loggedin_user === null || $local_user_data === null}
					<span class="navbar-text"> <a class="login" href="/login">Log In</a></span><a
						class="btn btn-light action-button"
						role="button"
						href="/signup">Sign Up</a
					>
				{:else if browser}
					<a class="btn btn-light action-button" role="button" sveltekit:prefetch href="/user">{JSON.parse($local_user_data).username}</a
					><span class="navbar-text"
						><button class="btn btn-light action-button" on:click={logout}>Logout</button></span
					>
				{/if}
			</div>
		</div>
	</nav>
</header>

<slot/>

<footer class="footer-dark">
	<div class="container">
		<div class="row">
			<div class="col-sm-6 col-md-3 item">
				
			</div>
			<div class="col-sm-6 col-md-3 item">
				<h3>About</h3>
				<ul>
					<li><a href="#">Contact</a></li>
					<li><a href="#">Team</a></li>
					<li><a href="#">Impressum</a></li>
				</ul>
			</div>
			<div class="col-md-6 item text">
				<h3>In Bloc</h3>
				<p>
					In Bloc is a platform for people to find and join gyms in their area.
				</p>
			</div>
		</div>
		<p class="copyright">In Bloc © 2022</p>
	</div>
	<script
		src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</footer>

