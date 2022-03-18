<script>
	import '../lib/firebase.js';
    import {local_user_data} from '$lib/stores.js';
    import { browser } from '$app/env';
    import {goto} from '$app/navigation';
	import {
		getAuth,
        sendPasswordResetEmail
	} from 'firebase/auth';
	let email = '';
    let message = '';
	let errorMessage = '';
    let email_sent = false;

    let local_data;
	if(browser && !local_data){
        local_data = JSON.parse($local_user_data);
    }

	async function forgotPassword() {
		if (email != '') {
            errorMessage = '';
            message = '';
			sendPasswordResetEmail(getAuth(), email)
				.then(() => {
					message = 'You will recieve an email to reset your password.';
                    email_sent = true;
				})
				.catch((error) => {
					errorMessage = error.code;
				});
		}
	}
</script>

<section class="login-dark">
    <div class="form">
        <h2 class="">Request new Password</h2>
        <div class="illustration"><i class="fa fa-envelope-o" /></div>
        <div class="mb-3">
            <input
                class="form-control"
                type="email"
                name="email"
                placeholder="Email"
                bind:value={email}
            />
        </div>
        {#if !email_sent}
        <div class="mb-3">
            <button class="btn btn-primary d-block w-100" on:click={forgotPassword}>Send Email</button>
        </div>
        {/if}
        <div class="mb-3">
            <button class="btn btn-primary d-block w-100" on:click={()=>{goto('/login')}}>Back to Login</button>
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