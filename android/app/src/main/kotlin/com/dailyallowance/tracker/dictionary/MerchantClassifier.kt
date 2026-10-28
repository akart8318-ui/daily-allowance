package com.dailyallowance.tracker.dictionary

data class ClassificationResult(
    val merchant: String,
    val category: String,
    val isQuickCommerce: Boolean = false,
    val isSubscription: Boolean = false,
    val isSelfTransfer: Boolean = false,
    val isCreditCardBill: Boolean = false,
    val isShielded: Boolean = false
)

object MerchantClassifier {

    private val rules = listOf(
        // Quick Commerce
        Regex("(?i)blinkit|grofers") to ClassificationResult("Blinkit", "Quick Commerce & Groceries", isQuickCommerce = true),
        Regex("(?i)zepto") to ClassificationResult("Zepto", "Quick Commerce & Groceries", isQuickCommerce = true),
        Regex("(?i)instamart") to ClassificationResult("Swiggy Instamart", "Quick Commerce & Groceries", isQuickCommerce = true),
        Regex("(?i)bigbasket|bbdaily") to ClassificationResult("BigBasket", "Quick Commerce & Groceries", isQuickCommerce = true),

        // Food & Coffee
        Regex("(?i)third\\s*wave") to ClassificationResult("Third Wave Coffee", "Food & Coffee"),
        Regex("(?i)blue\\s*tokai") to ClassificationResult("Blue Tokai Coffee", "Food & Coffee"),
        Regex("(?i)starbucks") to ClassificationResult("Starbucks", "Food & Coffee"),
        Regex("(?i)zomato") to ClassificationResult("Zomato", "Food & Dining"),
        Regex("(?i)swiggy") to ClassificationResult("Swiggy", "Food & Dining"),

        // Commute
        Regex("(?i)uber") to ClassificationResult("Uber", "Commute & Travel"),
        Regex("(?i)ola") to ClassificationResult("Ola Cabs", "Commute & Travel"),
        Regex("(?i)rapido") to ClassificationResult("Rapido", "Commute & Travel"),

        // Shields & Edge Cases
        Regex("(?i)rent|landlord|nestaway") to ClassificationResult("Rent Shield", "Fixed Shield (Rent)", isShielded = true),
        Regex("(?i)cred\\s*club|credit\\s*card\\s*bill") to ClassificationResult("Credit Card Payment", "Credit Card Bill", isCreditCardBill = true, isShielded = true),
        Regex("(?i)self\\s*transfer|transfer\\s*to\\s*own") to ClassificationResult("Self Transfer", "Self Account Transfer", isSelfTransfer = true, isShielded = true),
        Regex("(?i)zerodha|groww|indmoney|sip") to ClassificationResult("Investment SIP", "Investment & SIP", isShielded = true)
    )

    fun classify(text: String): ClassificationResult {
        for ((regex, result) in rules) {
            if (regex.containsMatchIn(text)) {
                return result
            }
        }
        return ClassificationResult(
            merchant = "Local UPI Merchant",
            category = "Local Merchant & UPI"
        )
    }
}
