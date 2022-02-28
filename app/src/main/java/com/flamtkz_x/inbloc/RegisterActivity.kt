package com.flamtkz_x.inbloc

import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

class RegisterActivity : AppCompatActivity() {

    private val switchToLoginBtn: Button by lazy { findViewById<Button>(R.id.signUpButtonLoginPage) }
    private val registerBtn: Button by lazy { findViewById<Button>(R.id.signUpButtonRegister) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        // Switch to login page
        switchToLoginBtn.setOnClickListener {
            finish()
        }

        // Register Button
        registerBtn.setOnClickListener {
            register()
        }
    }

    /**
     * Register the user
     * TODO: Implement
     */
    private fun register() {

    }
}