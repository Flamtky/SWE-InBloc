package com.flamtkz_x.inbloc

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.auth.FirebaseAuth

class LoginActivity : AppCompatActivity() {

    private val MIN_PASSWORD_LENGTH = 6

    private val switchToSignUp: Button by lazy { findViewById<Button>(R.id.signUpButtonMain) }
    private val loginBtn: Button by lazy { findViewById<Button>(R.id.loginbuttonMain) }

    private val emailField by lazy { findViewById<EditText>(R.id.emailMain) }
    private val passwordField by lazy { findViewById<EditText>(R.id.passwordMain) }

    private val progressBar by lazy { findViewById<android.widget.ProgressBar>(R.id.progressBar1) }

    private lateinit var auth: FirebaseAuth
    private lateinit var analytics: FirebaseAnalytics

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        auth = FirebaseAuth.getInstance()
        analytics = FirebaseAnalytics.getInstance(this)

        progressBar.visibility = android.view.View.INVISIBLE

        // if already logged in, go to main activity
        if (auth.currentUser != null) {
            checkLoginStatus()
            // TODO: remove this, just for testing
            val email = auth.currentUser!!.email
            Toast.makeText(this, "Already logged in $email", Toast.LENGTH_SHORT).show()
            auth.signOut()
        }

        // Switch to Register Page
        switchToSignUp.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }

        // Login Button
        loginBtn.setOnClickListener {
            login(emailField.text.toString().trim(), passwordField.text.toString().trim())
        }
    }

    /**
     * Login Function
     *
     * Shows a progress bar while logging in and disables all fields. Uses [FirebaseAnalytics] to log
     * @param email Email
     * @param password Password (min 6 characters)
     * @return void
     */
    fun login(email: String, password: String) {
        if (!areFieldsValid(email, password)) return

        toggleFields(false)
        progressBar.visibility = android.view.View.VISIBLE

        // Firebase Login with email and password
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                toggleFields(true)
                progressBar.visibility = android.view.View.INVISIBLE
                if (task.isSuccessful) {
                    onSuccessfulLogin()
                } else {
                    onFailedLogin()
                }
            }
    }

    /**
     * Checks if the current user is logged in and has an verified email.
     *
     * If not, it will show a dialog to the user to verify their email.
     * If the user has an verified email, it will go to the main activity.
     */
    private fun checkLoginStatus() {
        if (auth.currentUser != null) {
            if (auth.currentUser!!.isEmailVerified) {
                // TODO: go to main activity
            } else {
                Toast.makeText(this, "Please verify your email", Toast.LENGTH_LONG).show()
                // TODO: show dialog to verify email with resend button
            }
        }
    }

    /**
     * Gets called when the login is successful.
     *
     * Shows a toast. It logs the login with [FirebaseAnalytics] and goes to the main activity.
     */
    private fun onSuccessfulLogin() {
        Toast.makeText(this, "Login Successful", Toast.LENGTH_SHORT).show()
        analytics.logEvent(
            FirebaseAnalytics.Event.LOGIN,
            Bundle().apply {
                putString(FirebaseAnalytics.Param.METHOD, "Email")
                putString(FirebaseAnalytics.Param.SUCCESS, "true")
            })
        checkLoginStatus()
        // TODO: update UI with the signed-in user's information
    }

    /**
     * Gets called when the login is failed.
     *
     * It shows a toast with the error message and logs the login with [FirebaseAnalytics].
     * It clears and changes the focus to the password field.
     */
    private fun onFailedLogin() {
        // If sign in fails, display a message to the user.
        emailField.error = "Email or Password is incorrect"
        passwordField.text.clear()
        passwordField.error = "Email or Password is incorrect"
        passwordField.requestFocus()
        Toast.makeText(this, "Login Failed", Toast.LENGTH_SHORT).show()
        analytics.logEvent(
            FirebaseAnalytics.Event.LOGIN,
            Bundle().apply {
                putString(FirebaseAnalytics.Param.METHOD, "Email")
                putString(FirebaseAnalytics.Param.SUCCESS, "false")
            })
    }

    /**
     * Checks if the fields are valid.
     *
     * Gives feedback to the user if the fields are invalid.
     * It also change the focus to the invalid field.
     * @param email Email
     * @param password Password (min 6 characters)
     * @return Boolean True if fields are valid, false if not
     */
    private fun areFieldsValid(email: String, password: String): Boolean {
        if (email.isEmpty()) {
            emailField.requestFocus()
            emailField.error = "Email is required"
            return false
        }
        // Check if email is valid
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailField.requestFocus()
            emailField.error = "Email is invalid"
            return false
        }
        if (password.isEmpty()) {
            passwordField.requestFocus()
            passwordField.error = "Password is required"
            return false
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            passwordField.requestFocus()
            passwordField.error = "Password must be at least 6 characters"
            return false
        }
        return true
    }

    /**
     * Toggles if the fields are enabled or disabled
     * @param enabled Boolean to enable or disable the fields
     * @return void
     */
    private fun toggleFields(enable: Boolean) {
        loginBtn.isEnabled = enable
        emailField.isEnabled = enable
        passwordField.isEnabled = enable
    }
}