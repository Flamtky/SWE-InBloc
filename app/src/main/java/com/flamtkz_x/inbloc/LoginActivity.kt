package com.flamtkz_x.inbloc

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity

class LoginActivity : AppCompatActivity() {

    private val switchToSignUp: Button by lazy { findViewById<Button>(R.id.signUpButtonMain) }
    private val loginBtn: Button by lazy { findViewById<Button>(R.id.loginbuttonMain) }

    private val emailField by lazy { findViewById<EditText>(R.id.emailMain) }
    private val passwordField by lazy { findViewById<EditText>(R.id.passwordMain) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

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
        // return if email or password is empty
        if (email.trim().isEmpty()) {
            emailField.requestFocus()
            emailField.error = "Email is required"
            return
        }
        if (password.trim().isEmpty()) {
            passwordField.requestFocus()
            passwordField.error = "Password is required"
            return
        }
        

    }
}