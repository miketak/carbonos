package com.carbonos.help.internal;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Binds {@link HelpProperties} so the voter salt can come from the environment (spec 09). */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(HelpProperties.class)
class HelpConfig {
}
