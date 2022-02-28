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

    private lateinit var auth: FirebaseAuth
    private lateinit var analytics: FirebaseAnalytics

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        auth = FirebaseAuth.getInstance()
        analytics = FirebaseAnalytics.getInstance(this)

        // Switch to Register Page
        switchToSignUp.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }

        // Login Button
        loginBtn.setOnClickListener {
            login(emailField.text.toString(), passwordField.text.toString())
        }
    }

    /**
     * Login Function
     * @param email Email
     * @param password Password
     * @return void
     */
    fun login(email: String, password: String) {
        if (email.trim().isEmpty()) {
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
        if (password.trim().isEmpty()) {
            passwordField.requestFocus()
            passwordField.error = "Password is required"
            return
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            passwordField.requestFocus()
            passwordField.error = "Password must be at least 6 characters"
            return
        }
        // Firebase Login with email and password
        auth.signInWithEmailAndPassword(email.trim(), password.trim())
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    // Sign in success, TODO: update UI with the signed-in user's information
                    Toast.makeText(this, "Login Successful", Toast.LENGTH_SHORT).show()
                    analytics.logEvent(FirebaseAnalytics.Event.LOGIN, Bundle().apply {
                        putString(FirebaseAnalytics.Param.METHOD, "Email")
                    })
                } else {
                    // If sign in fails, display a message to the user.
                    emailField.error = "Email or Password is incorrect"
                    passwordField.error = "Email or Password is incorrect"
                    passwordField.text.clear()
                    Toast.makeText(this, "Login Failed", Toast.LENGTH_SHORT).show()
                    analytics.logEvent("FAILED_LOGIN", Bundle().apply {
                        putString(FirebaseAnalytics.Param.METHOD, "Email")
                    })
                }
            }
    }
}