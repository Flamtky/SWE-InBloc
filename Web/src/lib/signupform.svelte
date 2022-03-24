<script>
	import '../lib/firebase.js';
	import {
		getAuth,
		createUserWithEmailAndPassword,
		signOut,
		sendEmailVerification
	} from 'firebase/auth';

    import {goto} from '$app/navigation';
	import { loggedin_user, local_user_data } from '$lib/stores.js';
	import { browser } from '$app/env';
	let email = '';
	let password = '';
    let cpassword = '';
	let errorMessage = '';
	let message = '';
	let username = '';
	let zipcode = '';
    let icon = 'fa fa-user-plus';
	let registerBody = {
		email: email,
		username: username,
		zip: zipcode
	};

	//Login with firebase
	async function tryRegister() {
        message = '';
        errorMessage = '';
        if(!(password === cpassword)){
            errorMessage = 'Passwords do not match';
            return;
        }
		createUserWithEmailAndPassword(getAuth(), email, password)
			.then(async (userCredential) => {
				// send verification mail.
				await sendEmailVerification(userCredential.user);
				message =
					'We have send you a verification mail. Please check your mail and verify your account.';
                icon = 'fa fa-envelope';
				signOut(getAuth())
					.then(function () {
						// Sign-out successful.
						$loggedin_user = null;
						console.log('logout successful');
						//console.log($loggedin_user);
					})
					.catch(function (error) {
						// An error happened.
						alert('logout failed');
					});
			})
			.catch((error) => {
				errorMessage = error.code;
			});
	}
</script>

<section class="login-dark">
    <div class="form">
        <h2 class="">Register</h2>
        <div class="illustration"><i class={icon} /></div>
        <div class="mb-3">
            <input
                class="form-control"
                type="email"
                name="email"
                placeholder="Email"
                bind:value={email}
            />
        </div>
        <div class="mb-3">
            <input
                class="form-control"
                type="password"
                name="password"
                placeholder="Password"
                bind:value={password}
            />
        </div>
        <div class="mb-3">
            <input
                class="form-control"
                type="password"
                name="cofirmPassword"
                placeholder="Confirm Password"
                bind:value={cpassword}
            />
        </div>
        <div class="mb-3">
            <button class="btn btn-primary d-block w-100" on:click={tryRegister}>Sign Up</button>
        </div>
        <div class="mb-3">
        <button class="btn btn-primary d-block w-100" on:click={()=>{goto('/login');}}
            >Already got an Account?</button
        >
    </div>
        <p class="text-danger">{errorMessage}</p>
        <p class="text-success">{message}</p>
    </div>
</section>

<style>
	.login-dark {
		height: 1000px;
		background: #475d62 url(../../assets/img/star-sky.jpg);
		background-size: cover;
		position: relative;
	}

	.form {
		max-width: 320px;
		width: 90%;
		background-color: #1e2833;
		padding: 40px;
		border-radius: 4px;
		transform: translate(-50%, -50%);
		position: absolute;
		top: 50%;
		left: 50%;
		color: #fff;
		box-shadow: 3px 3px 4px rgba(0, 0, 0, 0.2);
	}

	.login-dark .illustration {
		text-align: center;
		padding: 15px 0 20px;
		font-size: 100px;
		color: #2980ef;
	}

	.login-dark form .form-control {
		background: none;
		border: none;
		border-bottom: 1px solid #434a52;
		border-radius: 0;
		box-shadow: none;
		outline: none;
		color: inherit;
	}

	.login-dark form .btn-primary {
		background: #214a80;
		border: none;
		border-radius: 4px;
		padding: 11px;
		box-shadow: none;
		margin-top: 26px;
		text-shadow: none;
		outline: none;
	}

	.login-dark form .btn-primary:hover,
	.login-dark form .btn-primary:active {
		background: #214a80;
		outline: none;
	}

	.login-dark form .forgot {
		display: block;
		text-align: center;
		font-size: 12px;
		color: #6f7a85;
		opacity: 0.9;
		text-decoration: none;
	}

	.login-dark form .forgot:hover,
	.login-dark form .forgot:active {
		opacity: 1;
		text-decoration: none;
	}

	.login-dark form .btn-primary:active {
		transform: translateY(1px);
	}
</style>