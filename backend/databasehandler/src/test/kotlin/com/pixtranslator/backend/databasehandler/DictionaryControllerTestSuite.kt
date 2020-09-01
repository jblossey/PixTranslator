package com.pixtranslator.backend.databasehandler

import org.junit.platform.runner.JUnitPlatform
import org.junit.platform.suite.api.SelectPackages
import org.junit.runner.RunWith

@RunWith(JUnitPlatform::class)
@SelectPackages("DictionaryControllerTestPackage")
class DictionaryControllerTestSuite 