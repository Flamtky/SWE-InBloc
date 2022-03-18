<script>
	import LoginForm from "$lib/loginform.svelte";
	import CreateProfileForm from "$lib/createprofile_form.svelte";

	import { goto } from '$app/navigation';
	import { loggedin_user, local_user_data } from '$lib/stores.js';
	import { browser } from '$app/env';

	let firstLogin = false;
	let local_data;
    if(browser && !local_data){
        local_data = JSON.parse($local_user_data);
    }
	//Login with firebase
	async function tryLogin() {
		errorMessage = '';
		signInWithEmailAndPassword(getAuth(), email, password)
			.then(async (cred) => {
				if (getAuth().currentUser.emailVerified == false) {
					errorMessage = 'Your account is not verified. Please check your email and try again.';
					await sendEmailVerification(getAuth().currentUser);
					signOut(getAuth())
						.then(function () {
							$loggedin_user = null;
							console.log('You got logged out because you are not verified.');
						})
						.catch(function (error) {
							// An error happened.
							console.log(error);
							alert('logout failed');
						});
					return;
				}
				getAuth()
					.currentUser.getIdToken(/* forceRefresh */ true)
					.then((idToken) => {
						// Send token to your backend via HTTPS
						// ...
						fetch(`http://localhost:1337/users/${cred.user.uid}`, {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${idToken}`
							}
						})
							.catch(function (error) {
								signOut(getAuth())
									.then(function () {
										// Sign-out successful.
									})
									.catch(function (error) {
										// An error happened.
										alert('logout failed');
									});
								console.log(error);
							})
							.then(async (response) => {
								console.log(response);
								if (response.status != 200) {
									$loggedin_user = null;
									data_not_found = true;
									return;
								} else {
									//console.log(await response.json());
									var json = await response.json();
									console.log(json.data.user);
									if (browser) {
										$local_user_data = JSON.stringify(json.data.user);
										window.location.href = '/';
									}
								}
							});
					})
					.catch((err) => {
						console.error(err);
					});
			})
			.catch(function (error) {
				errorMessage = error.code;
			});
	}

	async function createProfile() {
		errorMessage = '';
		if (!(username.length >= 3 && username.length <= 16)) {
			errorMessage = 'Username must be 3-16 characters long.';
			return;
		} //TODO Zipcode validation
		let user = getAuth().currentUser;
		let token = await user.getIdToken(/* forceRefresh */ true);
		registerBody.email = user.email;
		registerBody.username = username;
		registerBody.zip = zipcode.toString();
		let res = await fetch(`http://localhost:1337/users/${user.uid}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(registerBody)
		});
		let data = await res.json();
		console.log(data);
		if (res.ok) {
			$loggedin_user = user;
			if (browser) {
				$local_user_data = JSON.stringify(data.data.user);
				window.location.href = '/';
			}
		} else {
			errorMessage = data.error;
		}
	}


</script>
<body>
	{#if !local_data}
		{#if !firstLogin}
		<LoginForm bind:data_not_found={firstLogin}/>
		{:else}
		<CreateProfileForm/>
		{/if}
	<script
		src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
		{:else}
			<script>
				goto('/');
			</script>
		{/if}
</body>
