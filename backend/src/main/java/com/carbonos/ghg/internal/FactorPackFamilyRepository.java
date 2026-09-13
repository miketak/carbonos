package com.carbonos.ghg.internal;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FactorPackFamilyRepository extends JpaRepository<FactorPackFamily, String> {

	List<FactorPackFamily> findAllByOrderByPackKeyAsc();
}
