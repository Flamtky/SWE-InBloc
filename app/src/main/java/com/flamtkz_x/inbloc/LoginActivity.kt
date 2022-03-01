package com.flamtkz_x.inbloc

import android.content.Intent
import android.os.Bundle
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
            // TODO: go to main activity
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
     * @param email Email
     * @param password Password (min 6 characters)
     * @return void
     */
    fun login(email: String, password: String) {
        if (email.isEmpty()) {
            emailField.requestFocus()
            emailField.error = "Email is required"
            return
        }
        // Check if email is valid
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailField.requestFocus()
            emailField.error = "Email is invalid"
            return
        }
        if (password.isEmpty()) {
            passwordField.requestFocus()
            passwordField.error = "Password is required"
            return
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            passwordField.requestFocus()
            passwordField.error = "Password must be at least 6 characters"
            return
        }

        loginBtn.isEnabled = false
        emailField.isEnabled = false
        passwordField.isEnabled = false
        progressBar.visibility = android.view.View.VISIBLE


        // Firebase Login with email and password
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                loginBtn.isEnabled = true
                emailField.isEnabled = true
                passwordField.isEnabled = true
                progressBar.visibility = android.view.View.INVISIBLE
                if (task.isSuccessful) {
                    // Sign in success, TODO: update UI with the signed-in user's information
                    Toast.makeText(this, "Login Successful", Toast.LENGTH_SHORT).show()
                    analytics.logEvent(
                        FirebaseAnalytics.Event.LOGIN,
                        Bundle().apply { // TODO: Test this
                            putString(FirebaseAnalytics.Param.METHOD, "Email")
                        })
                } else {
                    // If sign in fails, display a message to the user.
                    emailField.error = "Email or Password is incorrect"
                    passwordField.error = "Email or Password is incorrect"
                    passwordField.text.clear()
                    Toast.makeText(this, "Login Failed", Toast.LENGTH_SHORT).show()
                    analytics.logEvent("FAILED_LOGIN", Bundle().apply { // TODO: Test this
                        putString(FirebaseAnalytics.Param.METHOD, "Email")
                    })
                }
            }
    }
}