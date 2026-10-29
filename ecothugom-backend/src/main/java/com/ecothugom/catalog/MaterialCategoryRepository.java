package com.ecothugom.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

interface MaterialCategoryRepository extends JpaRepository<MaterialCategory, Integer> {
    Page<MaterialCategory> findByActiveTrue(Pageable pageable);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name,Integer id);
    @Query("select c from MaterialCategory c where (:active is null or c.active=:active)")
    Page<MaterialCategory> findForAdmin(@Param("active") Boolean active,Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from MaterialCategory c where c.id=:id")
    Optional<MaterialCategory> findForUpdate(@Param("id") int id);
}
